package com.karvin.app.domain.repository

import com.karvin.app.core.common.ApiResult
import com.karvin.app.domain.model.CreateJobRequest
import com.karvin.app.domain.model.JobRequest

interface RemoteJobRepository {
    suspend fun getNearbyJobs(latitude: Double, longitude: Double, radiusKm: Double? = null): ApiResult<List<JobRequest>>
    suspend fun getMyJobs(): ApiResult<List<JobRequest>>
    suspend fun createJob(request: CreateJobRequest): ApiResult<JobRequest>
}
